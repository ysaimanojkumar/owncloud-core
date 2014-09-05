<div id="app-content">

	<div id="controls">
		<div class="actions creatable hidden">
			<?php /* Note: the template attributes are here only for the public page. These are normally loaded
					 through ajax instead (updateStorageStatistics).
			*/ ?>
		</div>
		<div id="file_action_panel"></div>
</div>

<div id="app-content-deletedUsers">

	<div id="emptycontent" class="hidden"><?php p($l->t('No deleted users left.'))?></div>

<table id="deletedUsersTable">
	<thead>
		<tr>
			<th id='headerName' class="hidden column-name">
				<div id="headerName-container">
					<input type="checkbox" id="select_all_users" class="select-all"/>
					<label for="select_all_users"></label>
					<a class="name sort columntitle" data-sort="name"><span><?php p($l->t('Name')); ?></span><span class="sort-indicator"></span></a>
				</div>
			</th>
			<th id="headerUid" class="hidden column-uid">
				<a class="ldap-uid sort columntitle" data-sort="uid"><span><?php p($l->t('LDAP User Name')); ?></span><span class="sort-indicator"></span></a>
			</th>
			<th id="headerDN" class="hidden column-dn">
				<a class="ldap-dn sort columntitle" data-sort="dn"><span><?php p($l->t('LDAP Distinguished Name')); ?></span><span class="sort-indicator"></span></a>
			</th>
			<th id="headerEmail" class="hidden column-email">
				<a class="user-email sort columntitle" data-sort="email"><span><?php p($l->t('Email')); ?></span><span class="sort-indicator"></span></a>
			</th>
			<th id="headerLastLogin" class="hidden column-login">
				<a id="lastLogin" class="lastLogin columntitle" data-sort="lastLogin"><span><?php p($l->t('Last Login')); ?></span><span class="sort-indicator"></span></a>
					<span class="selectedActions"><a href="" class="delete-selected">
						<?php p($l->t('Delete'))?>
						<img class="svg" alt="<?php p($l->t('Delete'))?>"
							 src="<?php print_unescaped(OCP\image_path("core", "actions/delete.svg")); ?>" />
					</a></span>
			</th>
		</tr>
	</thead>
	<tbody id="deletedUsersList">
	</tbody>
	<tfoot>
	</tfoot>
</table>

</div>

</div>
